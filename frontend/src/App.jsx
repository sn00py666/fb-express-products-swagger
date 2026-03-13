import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "./api/productsApi";
import "./App.scss";

const initialForm = {
  title: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  rating: "",
  imageUrl: "",
};

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await getProducts();
      setItems(data);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const all = items.map((p) => p.category).filter(Boolean);
    return ["Все", ...Array.from(new Set(all))];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "Все") return items;
    return items.filter((p) => p.category === selectedCategory);
  }, [items, selectedCategory]);

  const canSubmit = useMemo(() => {
    return (
      form.title.trim() !== "" &&
      form.category.trim() !== "" &&
      form.description.trim() !== "" &&
      form.price !== "" &&
      form.stock !== ""
    );
  }, [form]);

  function onFieldChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      rating: form.rating === "" ? 0 : Number(form.rating),
      imageUrl: form.imageUrl.trim(),
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setForm(initialForm);
      setEditingId("");
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  function onEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      category: item.category || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      stock: String(item.stock ?? ""),
      rating: String(item.rating ?? ""),
      imageUrl: item.imageUrl || "",
    });
  }

  function onCancelEdit() {
    setEditingId("");
    setForm(initialForm);
  }

  async function onDelete(id) {
    setError("");
    try {
      await deleteProduct(id);
      if (editingId === id) {
        onCancelEdit();
      }
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  return (
    <div className="shop-page">
      <div className="shop-page__bg" />

      <header className="shop-header">
        <h1>Food Market</h1>
        <p>Учебный каталог продуктов питания на React + Express</p>

        <div className="shop-controls">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button type="button" onClick={load}>
            Обновить
          </button>
        </div>
      </header>

      <section className="product-form-wrap">
        <h2>{editingId ? "Редактировать товар" : "Добавить товар"}</h2>
        <form className="product-form" onSubmit={onSubmit}>
          <input name="title" value={form.title} onChange={onFieldChange} placeholder="Название" />
          <input name="category" value={form.category} onChange={onFieldChange} placeholder="Категория" />
          <input name="description" value={form.description} onChange={onFieldChange} placeholder="Описание" />
          <input name="price" type="number" min="0" value={form.price} onChange={onFieldChange} placeholder="Цена" />
          <input name="stock" type="number" min="0" value={form.stock} onChange={onFieldChange} placeholder="На складе" />
          <input
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={onFieldChange}
            placeholder="Рейтинг (0-5)"
          />
          <input name="imageUrl" value={form.imageUrl} onChange={onFieldChange} placeholder="Ссылка на фото" />

          <div className="product-form__actions">
            <button type="submit" disabled={!canSubmit || saving}>
              {editingId ? "Сохранить" : "Создать"}
            </button>
            {editingId && (
              <button type="button" onClick={onCancelEdit} className="secondary">
                Отмена
              </button>
            )}
          </div>
        </form>
      </section>

      {loading && <p className="status">Загрузка товаров...</p>}
      {error && <p className="status status--error">Ошибка: {error}</p>}

      <section className="products-grid">
        {filteredItems.map((item) => (
          <article className="product-card" key={item.id}>
            <img
              className="product-card__image"
              src={item.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}
              alt={item.title}
              loading="lazy"
            />

            <div className="product-card__body">
              <span className="product-card__category">{item.category || "Без категории"}</span>
              <h3>{item.title}</h3>
              <p>{item.description || "Без описания"}</p>

              <div className="product-card__meta">
                <span>
                  Цена: <b>{Number(item.price) || 0} ₽</b>
                </span>
                <span>
                  На складе: <b>{Number(item.stock) || 0} шт.</b>
                </span>
              </div>

              <div className="product-card__rating">Рейтинг: {Number(item.rating || 0).toFixed(1)} / 5</div>

              <div className="product-card__actions">
                <button type="button" onClick={() => onEdit(item)}>
                  Редактировать
                </button>
                <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!loading && filteredItems.length === 0 && <p className="status">По выбранной категории товаров нет.</p>}
    </div>
  );
}
